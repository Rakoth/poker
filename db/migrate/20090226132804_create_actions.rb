class CreateActions < ActiveRecord::Migration
  def self.up
    create_table :actions do |t|
      t.references :game
      t.references :player
      t.integer :kind #хорошо было бы type,но слишком много мороки
      t.integer :value
      t.timestamp :created_at
    end
  end

  def self.down
    drop_table :actions
  end
end
