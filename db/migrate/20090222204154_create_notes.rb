class CreateNotes < ActiveRecord::Migration
  def self.up
    create_table :notes, :id => false do |t|
      t.references :user
      t.references :about_user
      t.integer :color
      t.string :description, :limit => 255
    end
  end

  def self.down
    drop_table :notes
  end
end
