class CreateUserInfos < ActiveRecord::Migration
  def self.up
    create_table :user_infos do |t|
      t.string :name
      t.string :country
      t.date :birthday
      t.string :language
      t.references :user

      t.timestamps
    end
  end

  def self.down
    drop_table :user_infos
  end
end
